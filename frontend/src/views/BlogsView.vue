<script setup>
const posts = [
  { id: 1, title: 'How to Choose a Pre-Owned Nintendo Switch', excerpt: 'Tips and tricks for getting the best deal on a used Nintendo Switch OLED...', image: 'https://picsum.photos/seed/blog1/600/400', date: 'Mar 8, 2026', category: 'Guides' },
  { id: 2, title: 'iPhone 16 vs iPhone 15: Is It Worth the Upgrade?', excerpt: 'We compare both models to help you decide which one offers better value...', image: 'https://picsum.photos/seed/blog2/600/400', date: 'Mar 5, 2026', category: 'Reviews' },
  { id: 3, title: 'Top 10 Gaming Accessories You Need in 2026', excerpt: 'From controllers to headsets, here are the must-have gaming accessories...', image: 'https://picsum.photos/seed/blog3/600/400', date: 'Mar 1, 2026', category: 'Lists' },
  { id: 4, title: 'Understanding Our Consignment Process', excerpt: 'Learn how our consignment model works and why it benefits both buyers and sellers...', image: 'https://picsum.photos/seed/blog4/600/400', date: 'Feb 25, 2026', category: 'Company' },
  { id: 5, title: 'MacBook Air vs MacBook Pro for Students', excerpt: 'Which MacBook is the best choice for your academic needs? We break it down...', image: 'https://picsum.photos/seed/blog5/600/400', date: 'Feb 20, 2026', category: 'Guides' },
  { id: 6, title: 'Buyer Protection: What You Need to Know', excerpt: 'Everything about our buyer protection policy to shop with confidence...', image: 'https://picsum.photos/seed/blog6/600/400', date: 'Feb 15, 2026', category: 'Company' },
]
</script>

<template>
  <div class="blogs-page">
    <div class="container">
      <div class="page-header text-center">
        <h1 class="page-title">Blog</h1>
        <p class="page-desc">News, guides, and tips from the SellForMe team</p>
      </div>

      <div class="blog-grid">
        <article v-for="post in posts" :key="post.id" class="blog-card">
          <div class="blog-image-wrap">
            <img :src="post.image" :alt="post.title" loading="lazy" />
            <span class="blog-category">{{ post.category }}</span>
          </div>
          <div class="blog-info">
            <span class="blog-date">{{ post.date }}</span>
            <h2 class="blog-title">{{ post.title }}</h2>
            <p class="blog-excerpt">{{ post.excerpt }}</p>
            <span class="read-more">Read More →</span>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<style scoped>
.blogs-page { padding: 40px 0 80px; }
.page-header { margin-bottom: 48px; }
.page-title { font-size: var(--font-size-4xl); font-weight: 700; }
.page-desc { color: var(--color-text-light); margin-top: 8px; }
.blog-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
.blog-card { border-radius: var(--radius-lg); overflow: hidden; border: 1px solid var(--color-border-light); transition: box-shadow var(--transition-normal); cursor: pointer; }
.blog-card:hover { box-shadow: var(--shadow-md); }
.blog-image-wrap { position: relative; aspect-ratio: 3/2; overflow: hidden; }
.blog-image-wrap img { width: 100%; height: 100%; object-fit: cover; transition: transform var(--transition-normal); }
.blog-card:hover .blog-image-wrap img { transform: scale(1.05); }
.blog-category { position: absolute; top: 12px; left: 12px; background: var(--color-primary); color: white; padding: 4px 12px; border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 600; }
.blog-info { padding: 20px; }
.blog-date { font-size: var(--font-size-xs); color: var(--color-text-lighter); }
.blog-title { font-size: var(--font-size-base); font-weight: 600; margin: 8px 0; line-height: 1.4; }
.blog-excerpt { font-size: var(--font-size-sm); color: var(--color-text-light); line-height: 1.6; margin-bottom: 12px; }
.read-more { font-size: var(--font-size-sm); color: var(--color-primary); font-weight: 600; }
@media (max-width: 768px) { .blog-grid { grid-template-columns: 1fr; } }
</style>
