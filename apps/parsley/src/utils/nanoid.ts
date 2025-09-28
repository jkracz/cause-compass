import { customAlphabet } from "nanoid";

// A custom nanoid generator with a 22 character alphabet
const generateId = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 22);

export default generateId;
