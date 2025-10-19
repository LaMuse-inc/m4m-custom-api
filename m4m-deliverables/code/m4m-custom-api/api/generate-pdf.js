/**
 * M4M PDF Generation API
 * Generates quote PDF documents
 */

const PDFDocument = require('pdfkit');

/**
 * Main PDF generation handler
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
    const { orderData } = req.body;

    if (!orderData) {
      res.status(400).json({ error: 'Missing orderData' });
      return;
    }

    // Generate PDF
    const pdfBuffer = await generateQuotePDF(orderData);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=quote_${orderData.order_id || 'draft'}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.status(200).send(pdfBuffer);

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate PDF',
      message: error.message 
    });
  }
};

/**
 * Generate quote PDF document
 */
async function generateQuotePDF(orderData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers = [];

      // Collect PDF data
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Add Japanese font support (using default font for now)
      // In production, add Japanese font: doc.font('path/to/japanese-font.ttf')

      // Header
      doc.fontSize(20).text('お見積書', { align: 'center' });
      doc.moveDown();

      // Order info
      doc.fontSize(12);
      doc.text(`見積番号: ${orderData.order_id || 'N/A'}`, { align: 'right' });
      doc.text(`作成日: ${new Date().toLocaleDateString('ja-JP')}`, { align: 'right' });
      doc.moveDown();

      // Customer info
      doc.fontSize(14).text('お客様情報');
      doc.fontSize(10);
      doc.text(`お名前: ${orderData.customer_name || 'N/A'}`);
      doc.text(`ご住所: ${orderData.address || 'N/A'}`);
      doc.moveDown();

      // Order details
      doc.fontSize(14).text('ご注文内容');
      doc.fontSize(10);
      doc.text(`商品: ${orderData.product_name || 'オリジナルTシャツ'}`);
      doc.text(`カラー・サイズ・枚数: ${orderData.color_size_quantity || 'N/A'}`);
      doc.text(`希望納期: ${orderData.desired_delivery_date || 'N/A'}`);
      doc.moveDown();

      // Pricing table
      doc.fontSize(14).text('お見積金額');
      doc.fontSize(10);
      
      const tableTop = doc.y + 10;
      const itemX = 50;
      const priceX = 400;
      
      // Table header
      doc.rect(itemX, tableTop, 500, 20).stroke();
      doc.text('項目', itemX + 5, tableTop + 5);
      doc.text('金額', priceX + 5, tableTop + 5);
      
      // Table row
      doc.rect(itemX, tableTop + 20, 500, 20).stroke();
      doc.text('商品代金', itemX + 5, tableTop + 25);
      doc.text(`¥${(orderData.quote_amount || 0).toLocaleString()}`, priceX + 5, tableTop + 25);
      
      // Total
      doc.rect(itemX, tableTop + 40, 500, 25).stroke();
      doc.fontSize(12).text('合計金額', itemX + 5, tableTop + 48);
      doc.text(`¥${(orderData.quote_amount || 0).toLocaleString()}`, priceX + 5, tableTop + 48);
      
      doc.moveDown(4);

      // Footer
      doc.fontSize(10);
      doc.text('お支払い方法: 銀行振込');
      doc.text(`振込先: ${orderData.bank_info || '後日ご案内いたします'}`);
      doc.moveDown();
      doc.text('※ご不明な点がございましたら、お気軽にお問い合わせください。', { align: 'center' });

      // Finalize PDF
      doc.end();

    } catch (error) {
      reject(error);
    }
  });
}

