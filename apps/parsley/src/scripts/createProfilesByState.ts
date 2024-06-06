import generateId from "../utils/nanoid";
import { parseEoFile } from "../utils/fileParse";
import { ActivityCode, NonprofitProfile } from "../types";

export const createProfiles = async (fileName: string) => {
    const parsedProfiles: NonprofitProfile[] = await parseEoFile(fileName);
    parsedProfiles.forEach((profile: NonprofitProfile) => {
        if (meetsCriteria(profile)) {
            const id: string = generateId();
            // create slug
            // create db entry

            // upload
        } else {
            // upload to not-inserted folder
        }
    });
};

const meetsCriteria = (profile: NonprofitProfile) => {
    const religiousActivities: ActivityCode[] | undefined = profile.activityCodes?.filter(
        (code) => code.category === "Religious Activities"
    );
    if (profile.foundation.code === "10" || profile.deductibility.code !== "1" || religiousActivities?.length !== 0) {
        return false;
    }
    return true;
};
