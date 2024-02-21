'use server';

import { timeSince } from '@/lib/utils';
import { fetchStatusResponse, fetchStatusResponseError } from '@/types/general';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

const fetchStatus = async (
  location: string
): Promise<fetchStatusResponse | Error> => {
  try {
    const table = `${location}_logs`;
    const cookieStore = cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      } as any
    );

    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1)
      .order('created_at', { ascending: false })
      .single();

    if (error) {
      console.log(error);
      return new Error(error.message ?? 'Unknown error');
    }

    // console.log('the data is ', data);
    const lastUpdated = new Date(data.created_at);
    console.log('the last updated of ', location, 'is ', lastUpdated);
    const now = new Date();
    const difference = Math.abs(now.getTime() - lastUpdated.getTime()) / 60000;
    // console.log('the total difference in minutes ', difference);

    const lastTimeOnline = timeSince(lastUpdated);
    console.log('the last online is ', lastTimeOnline);

    // console log the last updated and now in easier to read format
    // console.log('the last updated is ', lastUpdated.toLocaleString());
    // console.log('the now is ', now.toLocaleString());

    // if the difference is more than 6 minutes, return offline
    if (difference > 10) {
      console.log('the status is offline');
      return {
        lastTimeOnline: lastTimeOnline,
        status: 'off',
      };
    }
    console.log('the status is online');
    return {
      lastTimeOnline: lastTimeOnline,
      status: 'on',
    };
  } catch (error) {
    console.log('the error is ', error);
    return new Error('Unknown error');
  }
};

async function fetchLocations(): Promise<Location[] | Error> {
  try {
    const cookieStore = cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      } as any
    );
    const { data, error } = await supabase.from('locations').select('*');
    console.log('Locations data is ', data);

    if (error) {
      return new Error('Error fetching locations' + error);
    }

    return JSON.parse(JSON.stringify(data));
  } catch (error) {
    console.log('the error is ', error);
    return new Error('Error fetching locations' + error);
  }
}

export { fetchStatus, fetchLocations };
