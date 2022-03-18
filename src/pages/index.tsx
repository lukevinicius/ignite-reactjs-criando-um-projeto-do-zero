import { GetStaticProps } from 'next';

import Prismic from '@prismicio/client';
import Link from 'next/link';
import Head from 'next/head';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { useState } from 'react';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Header from '../components/Header';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { getPrismicClient } from '../services/prismic';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}
interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;
}

export default function Home({ postsPagination, preview }: HomeProps) {
  const { next_page, results } = postsPagination;
  const [posts, setPosts] = useState<Post[]>(results);
  const [nextPage, setNextPage] = useState<string>(next_page);

  function loadPosts() {
    if (nextPage) {
      fetch(nextPage)
        .then(response => response.json())
        .then(data => {
          const newPosts = data.results.map((post: Post) => ({
            uid: post.uid,
            first_publication_date: post.first_publication_date,
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            },
          }));

          setNextPage(data.next_page);
          setPosts([...posts, ...newPosts]);
        })
        .catch(() => {
          alert('Erro na aplicação!');
        });
    }
  }

  function handleLoadPostsClick() {
    loadPosts();
  }

  return (
    <>
      <Head>
        <title>Posts | Spacetraveling</title>
      </Head>

      <main className={styles.container}>
        <Header />
        <div className={styles.posts}>
          {posts.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a>
                <strong>{post.data.title}</strong>
                <p className={styles.subtitle}>{post.data.subtitle}</p>
                <div className={styles.infoPublication}>
                  <FiCalendar />
                  <time>
                    {format(new Date(post.first_publication_date), 'dd MMM u', {
                      locale: ptBR,
                    })}
                  </time>
                  <FiUser />
                  <p>{post.data.author}</p>
                </div>
              </a>
            </Link>
          ))}
          {nextPage && (
            <button type="button" onClick={handleLoadPostsClick}>
              Carregar mais posts
            </button>
          )}
          {preview && (
            <aside>
              <Link href="/api/exit-preview">
                <a style={{ color: '#F8F8F8' }}>Sair do modo Preview</a>
              </Link>
            </aside>
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: [
        'posts.title',
        'posts.subtitle',
        'posts.author',
        'posts.banner',
        'posts.content',
      ],
      pageSize: 30,
      ref: previewData?.ref ?? null,
    }
  );

  const { next_page } = postsResponse;

  const posts: Post[] = postsResponse.results.map(post => ({
    uid: post.uid,
    first_publication_date: post.first_publication_date,
    data: {
      title: post.data.title,
      subtitle: post.data.subtitle,
      author: post.data.author,
    },
  }));
  return {
    props: {
      preview,
      postsPagination: {
        next_page,
        results: posts,
      },
    },
  };
};
