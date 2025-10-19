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

  // Only accept POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Verify LINE signature
    const signature = req.headers['x-line-signature'];
    if (!signature) {
      res.status(401).json({ error: 'No signature' });
      return;
    }

    // Parse events
    const events = req.body.events || [];
    
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
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
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
      const difyResponse = await sendToDify(userId, userMessage);
      
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
  
  // Send welcome message
  await client.replyMessage(replyToken, {
    type: 'text',
    text: 'M4M OEM受注システムへようこそ！\n\nオリジナルアパレル製作のご相談を承ります。\n\nまずはデザインイメージをお送りください。'
  });
  
  // TODO: Create customer record in Airtable
  
  return { success: true };
}

/**
 * Send message to Dify for AI processing
 */
async function sendToDify(userId, message) {
  const DIFY_API_URL = 'https://api.dify.ai/v1/workflows/run';
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
          user_id: userId
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

