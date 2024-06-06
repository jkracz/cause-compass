CREATE TABLE IF NOT EXISTS "tax_exempt_organizations" (
	"id" varchar(22) PRIMARY KEY NOT NULL,
	"slug" varchar(255),
	"website_url" varchar(500),
	"image_url" varchar(500),
	"ein" varchar(9),
	"name" varchar(255),
	"in_care_of_name" varchar(255),
	"street_address" text,
	"city" varchar(255),
	"state" varchar(2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_updated" timestamp DEFAULT now(),
	"searched_at" timestamp DEFAULT now(),
	CONSTRAINT "tax_exempt_organizations_slug_unique" UNIQUE("slug"),
	CONSTRAINT "tax_exempt_organizations_ein_unique" UNIQUE("ein")
);
