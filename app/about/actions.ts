"use server";

import { Resend } from "resend";

export type ContactInput = {
  name: string;
  email: string;
  message: string;
};

export type ContactResult = { status: "success" } | { status: "error"; message: string };

export async function sendContactMessage(input: ContactInput): Promise<ContactResult> {
  const name = input.name.trim();
  const email = input.email.trim();
  const message = input.message.trim();

  if (!name || !email || !message) {
    return { status: "error", message: "Completa todos los campos." };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !to) {
    console.error("Faltan RESEND_API_KEY o CONTACT_TO_EMAIL en las variables de entorno.");
    return { status: "error", message: "El envío de correo no está configurado." };
  }

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from: process.env.CONTACT_FROM_EMAIL ?? "Arcade Vault <onboarding@resend.dev>",
    to,
    replyTo: email,
    subject: `Nuevo mensaje de ${name} — Arcade Vault`,
    text: `De: ${name} <${email}>\n\n${message}`,
  });

  if (error) {
    console.error("Error enviando correo de contacto", error);
    return { status: "error", message: "No se pudo enviar el mensaje. Intenta de nuevo." };
  }

  return { status: "success" };
}
