export function validatePinCreation(pin: string, confirmPin: string) {
  if (!/^\d{4}$/.test(pin)) {
    return "El PIN debe tener exactamente 4 dígitos";
  }

  if (pin !== confirmPin) {
    return "Los PIN no coinciden";
  }

  return null;
}