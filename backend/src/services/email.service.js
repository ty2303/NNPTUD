const nodemailer = require('nodemailer');
const { config } = require('../config/env');

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: false,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

const sendPasswordResetEmail = async (to, resetUrl) => {
  await transporter.sendMail({
    from: `"NNPTUD Shop" <${config.email.user}>`,
    to,
    subject: 'Đặt lại mật khẩu',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
        <h2>Yêu cầu đặt lại mật khẩu</h2>
        <p>Nhấn vào nút bên dưới để đặt lại mật khẩu. Link có hiệu lực trong <strong>1 giờ</strong>.</p>
        <a href="${resetUrl}"
           style="display:inline-block;padding:12px 24px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0">
          Đặt lại mật khẩu
        </a>
        <p style="color:#6b7280;font-size:13px">Nếu bạn không yêu cầu điều này, hãy bỏ qua email này.</p>
      </div>
    `,
  });
};

const sendOrderConfirmationEmail = async (
  to,
  orderCode,
  total
) => {
  await transporter.sendMail({
    from: `"NNPTUD Shop" <${config.email.user}>`,
    to,
    subject: `Xác nhận đơn hàng ${orderCode}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
        <h2>Cảm ơn bạn đã đặt hàng!</h2>
        <p>Đơn hàng <strong>${orderCode}</strong> của bạn đã được đặt thành công.</p>
        <p>Tổng tiền: <strong>${total.toLocaleString('vi-VN')} ₫</strong></p>
        <p>Chúng tôi sẽ thông báo khi đơn hàng được xử lý.</p>
      </div>
    `,
  });
};

module.exports = {
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
};
