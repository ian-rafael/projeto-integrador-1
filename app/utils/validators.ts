export function validateCPF (cpf: string) {
  const cpfLimpo = cpf.replace(/\D/g, '');

  if (cpfLimpo.length !== 11 || cpfLimpo.match(/(\d)\1{10}/)) {
    return "CPF inválido";
  }

  let sum = 0;
  let remainder: number;

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cpfLimpo.substring(i - 1, i)) * (11 - i);
  }

  remainder = (sum * 10) % 11;

  if ((remainder === 10) || (remainder === 11)) {
    remainder = 0;
  }

  if (remainder !== parseInt(cpfLimpo.substring(9, 10))) {
    return "CPF inválido";
  }

  sum = 0;

  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cpfLimpo.substring(i - 1, i)) * (12 - i);
  }

  remainder = (sum * 10) % 11;

  if ((remainder === 10) || (remainder === 11)) {
    remainder = 0;
  }

  if (remainder !== parseInt(cpfLimpo.substring(10, 11))) {
    return "CPF inválido";
  }
}

export function validateCNPJ (cnpj: string) {
  const cnpjLimpo = cnpj.replace(/\D/g,'');

  if (cnpjLimpo.length != 14) {
    return "CNPJ inválido";
  }

  if (
    cnpjLimpo == "00000000000000" ||
    cnpjLimpo == "11111111111111" ||
    cnpjLimpo == "22222222222222" ||
    cnpjLimpo == "33333333333333" ||
    cnpjLimpo == "44444444444444" ||
    cnpjLimpo == "55555555555555" ||
    cnpjLimpo == "66666666666666" ||
    cnpjLimpo == "77777777777777" ||
    cnpjLimpo == "88888888888888" ||
    cnpjLimpo == "99999999999999"
  ) {
    return "CNPJ inválido";
  }

  let tamanho = cnpjLimpo.length - 2
  let numeros = cnpjLimpo.substring(0,tamanho);
  const digitos = cnpjLimpo.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) {
      pos = 9;
    }
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
  if (resultado != parseInt(digitos.charAt(0))) {
    return "CNPJ inválido";
  }

  tamanho = tamanho + 1;
  numeros = cnpjLimpo.substring(0,tamanho);
  soma = 0;
  pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) {
      pos = 9;
    }
  }
  resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
  if (resultado != parseInt(digitos.charAt(1))) {
    return "CNPJ inválido";
  }
}

export function validateEmail (email: string) {
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regexEmail.test(email)) {
    return "E-mail inválido";
  }
}

export function validatePhone (phone: string) {
  const regexPhone = /^\([1-9]{2}\) (?:[2-8]|9[0-9])[0-9]{3}-[0-9]{4}$/;
  if (!regexPhone.test(phone)) {
    return "Telefone inválido";
  }
}

export function validateCEP (cep: string) {
  const regexCEP = /^\d{5}-?\d{3}$/;
  if (!regexCEP.test(cep)) {
    return "CEP inválido";
  }
}

export function validateCurrency (value: string, label: string) {
  const regexCurrency = /^\d+(?:\.\d{1,2})?$/;
  if (!regexCurrency.test(value)) {
    return label + " inválido";
  }
}
