import "dotenv/config";
import { titleCase } from "title-case";

const main = async () => {
    const testStrings = [
        "UNITED STATES BOWLING CONGRESS INC",
        "MARGUERITE DOWLING",
        "3250 E PALMER WASILLA HWY",
        "WASILLA",
        "test",
    ];

    testStrings.forEach((str) => {
        console.log(titleCase(str.toLowerCase()));
    });
};

main();
