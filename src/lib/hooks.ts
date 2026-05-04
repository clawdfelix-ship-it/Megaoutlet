'use client';

import { SWRConfiguration } from 'swr';
import axios from 'axios';

const axiosClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetcher = async (url: string) => {
  const res = await axiosClient.get(url);
  return res.data;
};

export const swrConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 5000,
};
