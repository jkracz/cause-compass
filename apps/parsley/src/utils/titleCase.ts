import { titleCase } from "title-case";
/**
 * Converts a given string to title case.
 *
 * Title case means that the first letter of each major word is capitalized,
 * while minor words are typically left in lowercase unless they are the first
 * or last word in the title.
 *
 * @param {string} str - The string to be converted to title case.
 * @returns {string} The input string converted to title case.
 */

export const convertToTitleCase = (str: string): string => {
  return titleCase(str.toLowerCase());
};
