import { GetStaticPaths, GetStaticProps } from 'next';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { Fragment } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { getPrismicClient } from '../../services/prismic';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const { isFallback } = useRouter();

  if (isFallback) {
    return <span>Carregando...</span>;
  }

  const minutesToRead = post.data.content.reduce((acc, content) => {
    function countWords(str: string): number {
      return str.trim().split(/\s+/).length;
    }

    // eslint-disable-next-line no-param-reassign
    acc += countWords(content.heading) / 200;
    // eslint-disable-next-line no-param-reassign
    acc += countWords(RichText.asText(content.body)) / 200;

    return Math.ceil(acc);
  }, 0);

  return (
    <>
      <div className={styles.container}>
        <Header />
      </div>
      <img className={styles.banner} src={post.data.banner.url} alt="" />

      <div className={styles.container}>
        <main className={styles.post}>
          <strong>{post.data.title}</strong>
          <div className={styles.infoPublication}>
            <FiCalendar />
            <time>
              {' '}
              {format(new Date(post.first_publication_date), 'dd MMM u', {
                locale: ptBR,
              })}
            </time>
            <FiUser />
            <p>{post.data.author}</p>
            <FiClock />
            <p>{minutesToRead} min</p>
          </div>
          <div className={styles.infoEdited}>
            <p>
              * editado em&nbsp;
              {format(new Date(post.first_publication_date), 'dd MMM u', {
                locale: ptBR,
              })}
              , ás 15:49
            </p>
          </div>
          <div className={styles.content}>
            {post.data.content.map((content, index) => (
              <Fragment key={String(index)}>
                <strong>{content.heading}</strong>
                <div
                  key={String(index)}
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(content.body),
                  }}
                />
              </Fragment>
            ))}
          </div>
          <span className={styles.border} />
          <div className={styles.containerLinks}>
            <div className={styles.linkPrevious}>
              {/* <strong>Como utilizar Hooks</strong> */}
              <Link href="/post/como-utilizar-hooks">
                <a>Post anterior</a>
              </Link>
            </div>
            <div className={styles.linkPrevious}>
              {/* <strong>Criando um app CRA do Zero</strong> */}
              <Link href="/post/criando-um-app-cra-d-zero">
                <a>Post anterior</a>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.banner', 'posts.author', 'posts.content'],
    }
  );

  const paths = posts.results.map(result => ({
    params: {
      slug: result.uid,
    },
  }));

  return {
    paths,
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content,
      subtitle: response.data.subtitle,
    },
    uid: response.uid,
  };

  return {
    props: {
      post,
    },
  };
};
