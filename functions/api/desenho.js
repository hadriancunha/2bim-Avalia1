import { gerarDesenho, numeroValido } from "../../lib/desenho.js";

export async function onRequest({ request, env }) {
  if (request.method !== "POST") {
    return new Response("Método não permitido", { status: 405 });
  }

  let dados;
  try {
    dados = await request.json();
  } catch {
    return new Response("JSON inválido", { status: 400 });
  }

  if (
    !dados ||
    typeof dados !== "object" ||
    Array.isArray(dados) ||
    !numeroValido(dados.numero)
  ) {
    return new Response("Número inválido", { status: 400 });
  }

  const autorizacao = request.headers.get("Authorization") || "";
  const token = autorizacao.match(/^Bearer\s+(\S+)$/i);

  if (!token) {
    return new Response("Token ausente", { status: 401 });
  }

  let usuario;
  try {
    const resposta = await fetch(
      "https://oauth2.googleapis.com/tokeninfo?id_token=" +
        encodeURIComponent(token[1])
    );

    if (!resposta.ok) {
      return new Response("Token inválido", { status: 401 });
    }

    usuario = await resposta.json();
  } catch {
    return new Response("Token inválido", { status: 401 });
  }

  if (
    usuario.aud !== env.GOOGLE_CLIENT_ID ||
    String(usuario.email_verified) !== "true" ||
    typeof usuario.email !== "string" ||
    !usuario.email
  ) {
    return new Response("Token não autorizado", { status: 401 });
  }

  return new Response(gerarDesenho(dados.numero, usuario.email), {
    status: 200,
    headers: { "Content-Type": "image/svg+xml" },
  });
}
