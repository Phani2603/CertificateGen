import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import BlogPostClient from '@/components/blog/blog-post-client'

export default async function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params
    const { id } = resolvedParams

    // Construct path to markdown file
    // For now, defaulting to '1.md' if the ID matches, or just trying to load [id].md
    // If the user navigates to /blog/1, we look for content/blog/1.md
    const postsDirectory = path.join(process.cwd(), 'content/blog')
    const filePath = path.join(postsDirectory, `${id}.md`)

    let fileContent = ''
    try {
        fileContent = await fs.readFile(filePath, 'utf8')
    } catch (error) {
        // Fallback for demo purposes if specific ID file doesn't exist
        // You might want to show a 404 here normally
        try {
            const defaultPath = path.join(postsDirectory, '1.md')
            fileContent = await fs.readFile(defaultPath, 'utf8')
        } catch (e) {
            return <div>Post not found</div>
        }
    }

    const { data: frontmatter, content } = matter(fileContent)

    return (
        <BlogPostClient
            content={content}
            frontmatter={frontmatter as any}
            id={id}
        />
    )
}
