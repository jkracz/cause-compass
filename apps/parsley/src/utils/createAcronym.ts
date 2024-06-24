// primarily used when finding the correct url for orgs

export const createAcronym = (fullString: string) => {
    let acronym = "";
    for (let i = 0; i < fullString.length; ++i) {
        if (i === 0 || fullString[i - 1] === " ") {
            acronym += fullString[i];
        }
    }
    return acronym;
};
