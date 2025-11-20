export function generateQuestionPaperId(setNumber, versionNumber) {
  const prefix = 'V';
  const timestamp = Date.now().toString().slice(-6);
  const setStr = setNumber.toString().padStart(2, '0');
  const versionStr = versionNumber.toString().padStart(2, '0');
  
  return `${prefix}${timestamp}${setStr}${versionStr}`;
}