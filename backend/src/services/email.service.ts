// TODO: implement Email service using Nodemailer

// Send password reset email
export const sendPasswordResetEmail = async (to: string, resetUrl: string): Promise<void> => {
  // TODO: use nodemailer transporter to send reset password email
};

// Send order confirmation email
export const sendOrderConfirmationEmail = async (to: string, orderCode: string, total: number): Promise<void> => {
  // TODO: use nodemailer transporter to send order confirmation email
};
