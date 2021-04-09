import { GetStaticProps } from 'next';
import Link from 'next/link';

import { FiCalendar, FiUser } from 'react-icons/fi';

import Prismic from '@prismicio/client';
import { useState } from 'react';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Head from 'next/head';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Header from '../components/Header';

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
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [data, setData] = useState(postsPagination);

  async function getMorePosts(): Promise<void> {
    fetch(data.next_page)
      .then(response => response.json())
      .then(responseData => {
        const newPosts = data.results;

        responseData.results.map(post =>
          newPosts.push({
            uid: post.uid,
            first_publication_date: format(
              new Date(post.first_publication_date),
              'dd MMM yyyy',
              { locale: ptBR }
            ),
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            },
          })
        );

        setData({
          next_page: responseData.next_page,
          results: newPosts,
        });
      });
  }

  return (
    <>
      <Head>
        <title>SpaceTraveling</title>
      </Head>

      <Header />

      <div className={commonStyles.container}>
        {data.results.map(post => (
          <Link href={`/post/${post.uid}`} key={post.uid}>
            <a className={styles.post}>
              <h1>{post.data.title}</h1>
              <p>{post.data.subtitle}</p>

              <div className={commonStyles.postInformation}>
                <span>
                  <FiCalendar />
                  {format(
                    new Date(post.first_publication_date),
                    'dd MMM yyyy',
                    {
                      locale: ptBR,
                    }
                  )}
                </span>
                <span>
                  <FiUser />
                  {post.data.author}
                </span>
              </div>
            </a>
          </Link>
        ))}

        {data.next_page && (
          <button
            type="button"
            className={styles.button}
            onClick={getMorePosts}
          >
            Carregar mais posts
          </button>
        )}
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['post.title', 'post.subtitle', 'post.author'],
      pageSize: 1,
    }
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  const { next_page } = postsResponse;

  const postsPagination = {
    results: posts,
    next_page,
  };

  return {
    props: {
      postsPagination,
    },
  };
};
