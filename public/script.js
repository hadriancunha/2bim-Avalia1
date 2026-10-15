const CLIENT_ID = "849367533427-ljmpqe4a7b78rmqpcummk21ji564dp6u.apps.googleusercontent.com";

const formulario = document.getElementById("formulario");
const campoNumero = document.getElementById("numero");
const area = document.getElementById("desenho");
const mensagem = document.getElementById("mensagem");
const botaoBaixar = document.getElementById("baixar");

let idToken = null;
let svgAtual = "";

const googleScript = document.createElement("script");
googleScript.src = "https://accounts.google.com/gsi/client";
googleScript.async = true;

googleScript.onload = () => {
  google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: (resposta) => {
      idToken = resposta.credential;
      mensagem.textContent = "";
    },
  });

  google.accounts.id.renderButton(
    document.getElementById("google-login"),
    { theme: "outline", size: "large" }
  );
};

googleScript.onerror = () => {
  mensagem.textContent = "Não foi possível carregar o login do Google.";
};

document.head.appendChild(googleScript);

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  mensagem.textContent = "";
  area.innerHTML = "";
  botaoBaixar.hidden = true;
  svgAtual = "";

  const textoNumero = campoNumero.value.trim();
  const numero = Number(textoNumero);

  if (
    textoNumero === "" ||
    !Number.isInteger(numero) ||
    numero < 1 ||
    numero > 100
  ) {
    mensagem.textContent = "Digite um inteiro entre 1 e 100.";
    return;
  }

  if (!idToken) {
    mensagem.textContent = "Entre com sua conta Google antes de desenhar.";
    return;
  }

  try {
    const resposta = await fetch("/api/desenho", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ numero }),
    });

    if (resposta.status === 400) {
      mensagem.textContent = "O número enviado é inválido.";
      return;
    }

    if (resposta.status === 401) {
      idToken = null;
      mensagem.textContent =
        "Login expirado ou não aceito. Entre novamente com Google.";
      return;
    }

    if (!resposta.ok) {
      mensagem.textContent = `Erro ao gerar desenho: ${resposta.status}.`;
      return;
    }

    svgAtual = await resposta.text();
    area.innerHTML = svgAtual;
    botaoBaixar.hidden = false;
  } catch {
    mensagem.textContent = "Falha de conexão. Tente novamente.";
  }
});

botaoBaixar.addEventListener("click", () => {
  if (!svgAtual) return;

  const arquivo = new Blob([svgAtual], { type: "image/svg+xml" });
  const url = URL.createObjectURL(arquivo);
  const link = document.createElement("a");

  link.href = url;
  link.download = "exemplo.svg";
  link.click();

  URL.revokeObjectURL(url);
});
