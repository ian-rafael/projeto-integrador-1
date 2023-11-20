export function maskCPF (cpf: string): string {
  const numericCpf = cpf.replace(/\D/g, '').slice(0, 11);

  const maskedCpf = numericCpf.replace(
    /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
    "$1.$2.$3-$4"
  );

  return maskedCpf;
}

export function maskCNPJ (cnpj: string): string {
  const numericCnpj = cnpj.replace(/\D/g, '').slice(0, 14);

  const maskedCnpj = numericCnpj.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );

  return maskedCnpj;
}

export function maskCEP (cep: string): string {
  const numericCep = cep.replace(/\D/g, '').slice(0, 8);

  const maskedCep = numericCep.replace(
    /^(\d{5})(\d{3})$/,
    "$1-$2"
  );

  return maskedCep;
}

export function maskPhone (phone: string): string {
  const numericPhone = phone.replace(/\D/g, '').slice(0, 11);

  const maskedPhone = numericPhone.replace(
    /^(\d{2})(\d{4,5})(\d{4})$/,
    "($1) $2-$3"
  );

  return maskedPhone;
}
