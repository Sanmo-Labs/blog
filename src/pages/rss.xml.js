import rss from "@astrojs/rss";
import { getCollection } from "astro:content";

export async function GET(context) {
  const posts = (await getCollection("posts", ({ data }) => !data.draft)).sort(
    (a, b) => b.data.publishedDate.valueOf() - a.data.publishedDate.valueOf(),
  );

  return rss({
    title: "RumptyCloud Blog",
    description:
      "Practical guides for deploying applications, managing infrastructure, and building on RumptyCloud.",
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishedDate,
      link: `/blog/${post.id}/`,
      categories: post.data.tags,
      author: post.data.author,
    })),
    customData: "<language>en-ng</language>",
  });
}
