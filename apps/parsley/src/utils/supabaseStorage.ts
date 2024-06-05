import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import "dotenv/config";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const uploadJsonToSupabase = async (filePath: string, bucketName: string, fileName: string) => {
    const file = fs.readFileSync(filePath, "utf-8");
    const { data, error } = await supabase.storage.from(bucketName).upload(fileName, file, { contentType: "json" });

    if (error) {
        console.error("Error uploading file:", error.message);
    } else {
        console.log("File uploaded successfully:", data);
    }
};

export const downloadJsonFromSupabase = async (bucketName: string, fileName: string): Promise<Object> => {
    const { data, error } = await supabase.storage.from(bucketName).download(fileName);

    if (error) {
        console.error("Error downloading file:", error.message);
        return {};
    } else {
        const fileContent = await data.text();
        const jsonData = JSON.parse(fileContent);
        console.log("File downloaded and parsed successfully:", jsonData);
        return jsonData;
    }
};
