import { titleCase } from "title-case";

export const convertToTitleCase = (str: string): string => {
    return titleCase(str.toLowerCase());
};
