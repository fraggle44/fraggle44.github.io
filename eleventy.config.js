import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import { CORE_SCHEMA, load } from "js-yaml";

const require = createRequire(import.meta.url);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function pkgFile(name, file) {
  return path.join(path.dirname(require.resolve(`${name}/package.json`)), file);
}

function loadYaml(file) {
  return load(readFileSync(file, "utf8"), { schema: CORE_SCHEMA });
}

function cabinet() {
  const listed = loadYaml("data/categories.yml");
  const raw = loadYaml("data/links.yml");
  if (!Array.isArray(listed) || !Array.isArray(raw?.links)) {
    throw new Error("data/categories.yml and data/links.yml must both be lists of records");
  }

  const byId = new Map(listed.map((category) => [category.id, category]));
  const links = raw.links
    .filter((link) => link.status === "live")
    .map((link) => {
      const category = byId.get(link.category);
      if (!category) {
        throw new Error(`Keep "${link.id}" uses unknown category "${link.category}"`);
      }
      return { ...link, categoryTitle: category.title };
    })
    .sort((a, b) => String(b.kept_on).localeCompare(String(a.kept_on)));

  const categories = listed.map((category) => ({
    ...category,
    links: links.filter((link) => link.category === category.id),
  }));

  return { categories, links };
}

const fontCopies = {
  [pkgFile("@fontsource/fraunces", "files/fraunces-latin-500-normal.woff2")]: "assets/fonts/fraunces-500.woff2",
  [pkgFile("@fontsource/fraunces", "files/fraunces-latin-600-normal.woff2")]: "assets/fonts/fraunces-600.woff2",
  [pkgFile("@fontsource/literata", "files/literata-latin-400-normal.woff2")]: "assets/fonts/literata-400.woff2",
  [pkgFile("@fontsource/literata", "files/literata-latin-400-italic.woff2")]: "assets/fonts/literata-400-italic.woff2",
  [pkgFile("@fontsource/literata", "files/literata-latin-600-normal.woff2")]: "assets/fonts/literata-600.woff2",
  [pkgFile("@fontsource/dm-mono", "files/dm-mono-latin-400-normal.woff2")]: "assets/fonts/dm-mono-400.woff2",
  [pkgFile("@fontsource/fraunces", "LICENSE")]: "assets/fonts/fraunces-OFL.txt",
  [pkgFile("@fontsource/literata", "LICENSE")]: "assets/fonts/literata-OFL.txt",
  [pkgFile("@fontsource/dm-mono", "LICENSE")]: "assets/fonts/dm-mono-OFL.txt",
};

export default function (eleventyConfig) {
  eleventyConfig.addGlobalData("cabinet", cabinet);
  eleventyConfig.addGlobalData("site", {
    title: "The Excellent Internet",
    url: "https://fraggle44.github.io",
    description: "A public shelf of excellent keeps.",
  });

  eleventyConfig.addFilter("dateLabel", (value) => {
    const [year, month, day] = String(value).slice(0, 10).split("-");
    const monthName = MONTHS[Number(month) - 1];
    if (!year || !monthName || !day) return String(value);
    return `${Number(day)} ${monthName} ${year}`;
  });

  eleventyConfig.addFilter("hostPath", (value) => {
    const url = new URL(value);
    const pathname = url.pathname === "/" ? "" : url.pathname.replace(/\/$/, "");
    return `${url.host}${pathname}`;
  });

  eleventyConfig.addPassthroughCopy({ "src/assets/site.css": "assets/site.css" });
  eleventyConfig.addPassthroughCopy({ "src/favicon.svg": "favicon.svg" });
  eleventyConfig.addPassthroughCopy(fontCopies);
  eleventyConfig.addWatchTarget("data");

  return {
    pathPrefix: "/",
    htmlTemplateEngine: "njk",
    dir: {
      input: "src",
      includes: "_includes",
      output: "_site",
    },
  };
}
