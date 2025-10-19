/**
 * M4M LINE Webhook API
 * Handles incoming LINE messages and events
 */

const line = require('@line/bot-sdk');
const axios = require('axios');

// Configuration
const config = {
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || ''
};

const client = new line.Client(config);

/**
 * Main webhook handler
 */
module.exports = async (req, res) => {
  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Handle GET request (for webhook verification)
  if (req.method === 'GET') {
    res.status(200).json({ 
      status: 'ok',
      message: 'M4M LINE Webhook is running' 
    });
    return;
  }

  // Only accept POST requests for webhook events
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Verify LINE signature
    const signature = req.headers['x-line-signature'];
    
    // LINE webhook verification might not have signature
    // Return 200 OK for verification requests
    if (!signature) {
      console.log('No signature - might be verification request');
      res.status(200).json({ 
        status: 'ok',
        message: 'Webhook received' 
      });
      return;
    }

    // Parse events
    const events = req.body.events || [];
    
    // If no events, return success (verification request)
    if (events.length === 0) {
      res.status(200).json({ 
        status: 'ok',
        message: 'No events to process' 
      });
      return;
    }
    
    // Process each event
    const results = await Promise.all(
      events.map(event => handleEvent(event))
    );

    res.status(200).json({ 
      success: true, 
      processed: results.length 
    });

  } catch (error) {
    console.error('Webhook error:', error);
    
    // Return 200 even on error to avoid LINE retrying
    res.status(200).json({ 
      success: false,
      error: error.message 
    });
  }
};

/**
 * Handle individual LINE event
 */
async function handleEvent(event) {
  console.log('Event:', JSON.stringify(event));

  // Handle different event types
  switch (event.type) {
    case 'message':
      return handleMessage(event);
    case 'postback':
      return handlePostback(event);
    case 'follow':
      return handleFollow(event);
    default:
      console.log('Unhandled event type:', event.type);
      return null;
  }
}

/**
 * Handle message events
 */
async function handleMessage(event) {
  const { replyToken, message, source } = event;
  const userId = source.userId;

  // Handle text messages
  if (message.type === 'text') {
    const userMessage = message.text;
    
    // Send to Dify for processing
    try {
      const difyResponse = await sendToDify(userId, userMessage, 'message');
      
      // Reply to user
      await client.replyMessage(replyToken, {
        type: 'text',
        text: difyResponse
      });
      
    } catch (error) {
      console.error('Dify error:', error);
      await client.replyMessage(replyToken, {
        type: 'text',
        text: 'エラーが発生しました。もう一度お試しください。'
      });
    }
  }

  // Handle image messages
  if (message.type === 'image') {
    await client.replyMessage(replyToken, {
      type: 'text',
      text: 'デザイン画像を受け取りました。処理中です...'
    });
    
    // TODO: Download image and process
  }

  return { success: true };
}

/**
 * Handle postback events
 */
async function handlePostback(event) {
  const { replyToken, postback } = event;
  const data = postback.data;
  
  console.log('Postback data:', data);
  
  await client.replyMessage(replyToken, {
    type: 'text',
    text: `選択を受け付けました: ${data}`
  });
  
  return { success: true };
}

/**
 * Handle follow events (user adds bot as friend)
 */
async function handleFollow(event) {
  const { replyToken, source } = event;
  const userId = source.userId;
  
  console.log('New follower:', userId);
  
  try {
    // 1. Get LINE profile information
    const profile = await client.getProfile(userId);
    console.log('Profile:', JSON.stringify(profile));
    
    // 2. Register customer to Airtable
    await registerCustomerToAirtable({
      line_user_id: userId,
      line_display_name: profile.displayName,
      status: 'active',
      created_at: new Date().toISOString()
    });
    
    // 3. Notify Dify about new follower
    await sendToDify(userId, `[SYSTEM] 友だち追加: ${profile.displayName}`, 'follow');
    
    // 4. Send welcome message
    await client.replyMessage(replyToken, {
      type: 'text',
      text: `${profile.displayName}さん、友だち追加ありがとうございます！🎉\n\nM4Mアパレル OEM受注システムへようこそ。\n\nデザイン画像を送っていただければ、お見積もりを作成いたします。\n\n何かご質問があれば、お気軽にメッセージをお送りください。`
    });
    
    return { success: true, userId, registered: true };
    
  } catch (error) {
    console.error('Error in handleFollow:', error);
    
    // エラーでも基本的なウェルカムメッセージは送信
    try {
      await client.replyMessage(replyToken, {
        type: 'text',
        text: '友だち追加ありがとうございます！'
      });
    } catch (replyError) {
      console.error('Error sending welcome message:', replyError);
    }
    
    return { success: false, error: error.message };
  }
}

/**
 * Send message to Dify for AI processing
 */
async function sendToDify(userId, message, eventType = 'message') {
  const DIFY_API_URL = process.env.DIFY_WORKFLOW_URL || 'https://api.dify.ai/v1/workflows/run';
  const DIFY_API_KEY = process.env.DIFY_API_KEY || '';
  
  if (!DIFY_API_KEY) {
    throw new Error('DIFY_API_KEY not configured');
  }
  
  try {
    const response = await axios.post(
      DIFY_API_URL,
      {
        inputs: {
          message: message,
          event_type: eventType
        },
        response_mode: 'blocking',
        user: userId
      },
      {
        headers: {
          'Authorization': `Bearer ${DIFY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Extract response from Dify
    const data = response.data;
    return data.data?.outputs?.message || 'ご質問ありがとうございます。';
    
  } catch (error) {
    console.error('Dify API error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Register customer to Airtable
 */
async function registerCustomerToAirtable(customerData) {
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || '';
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || '';
  
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('Airtable credentials not configured');
    return null;
  }
  
  try {
    const response = await axios.post(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Customers`,
      {
        fields: customerData
      },
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Customer registered to Airtable:', response.data.id);
    return response.data;
    
  } catch (error) {
    console.error('Airtable registration error:', error.response?.data || error.message);
    // Airtableエラーは致命的ではないため、ログのみ
    return null;
  }
}

