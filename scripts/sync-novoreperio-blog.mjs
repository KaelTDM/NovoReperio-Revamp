import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const API_ROOT = "https://novoreperio.com/wp-json/wp/v2/posts";
const PER_PAGE = 100;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(__dirname, "../src/data/novoreperio-blog.json");

const fetchPostsPage = async (page) => {
  const url = new URL(API_ROOT);
  url.searchParams.set("per_page", String(PER_PAGE));
  url.searchParams.set("page", String(page));
  url.searchParams.set("_embed", "1");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "NovoReperioBlogSync/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch page ${page}: ${response.status} ${response.statusText}`);
  }

  const posts = await response.json();
  const totalPages = Number(response.headers.get("x-wp-totalpages") ?? "1");
  const totalPosts = Number(response.headers.get("x-wp-total") ?? String(posts.length));

  return { posts, totalPages, totalPosts };
};

const normalizePost = (post) => {
  const embedded = post._embedded ?? {};
  const featuredMedia = embedded["wp:featuredmedia"]?.[0];
  const author = embedded.author?.[0];
  const terms = embedded["wp:term"] ?? [];
  const categories = (terms[0] ?? [])
    .map((term) => term?.name)
    .filter(Boolean);
  const tags = (terms[1] ?? [])
    .map((term) => term?.name)
    .filter(Boolean);

  return {
    id: post.id,
    slug: post.slug,
    link: post.link,
    date: post.date,
    modified: post.modified,
    titleHtml: post.title?.rendered ?? "",
    excerptHtml: post.excerpt?.rendered ?? "",
    author: author?.name ?? "Novo Reperio",
    categories,
    tags,
    featuredImage:
      featuredMedia?.source_url ??
      post.yoast_head_json?.og_image?.[0]?.url ??
      null,
    featuredImageAlt:
      featuredMedia?.alt_text ||
      post.yoast_head_json?.og_title ||
      post.title?.rendered ||
      "Novo Reperio blog post",
  };
};

const main = async () => {
  const firstPage = await fetchPostsPage(1);
  const pages = [firstPage];

  for (let page = 2; page <= firstPage.totalPages; page += 1) {
    pages.push(await fetchPostsPage(page));
  }

  const normalizedPosts = pages
    .flatMap((entry) => entry.posts)
    .map(normalizePost)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const payload = {
    source: "https://novoreperio.com/blog/",
    api: `${API_ROOT}?per_page=${PER_PAGE}&_embed=1`,
    syncedAt: new Date().toISOString(),
    totalPosts: firstPage.totalPosts,
    posts: normalizedPosts,
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log(`Synced ${normalizedPosts.length} blog posts to ${outputPath}`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
