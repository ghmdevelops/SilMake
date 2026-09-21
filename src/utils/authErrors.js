const messages = {
  "auth/invalid-email": "E-mail inválido.",
  "auth/user-disabled": "Esta conta foi desativada.",
  "auth/user-not-found": "Não encontramos uma conta com esse e-mail.",
  "auth/wrong-password": "Senha incorreta.",
  "auth/invalid-credential": "E-mail ou senha incorretos.",
  "auth/email-already-in-use": "Já existe uma conta com esse e-mail.",
  "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
  "auth/popup-closed-by-user": "A janela de login foi fechada antes de concluir.",
  "auth/too-many-requests": "Muitas tentativas. Aguarde um pouco antes de tentar de novo.",
  "auth/network-request-failed": "Falha de conexão. Verifique sua internet.",
};

export function translateAuthError(error) {
  return messages[error?.code] || "Ocorreu um erro. Tente novamente.";
}
