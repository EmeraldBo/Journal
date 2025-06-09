const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://iwzzrkvbdpzkxuiyvnrh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3enpya3ZiZHB6a3h1aXl2bnJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNjM1ODQsImV4cCI6MjA2NDczOTU4NH0.RWfvuIn-ITSGLo1MyARW6lPLSePXhVnKKSgKa9rzdY8';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

exports.handler = async (event, context) => {
  const { httpMethod, path, queryStringParameters, body } = event;

  // /comments endpoint
if (path.endsWith('/comments')) {
if (httpMethod === 'GET') {
  const page = parseInt(queryStringParameters.page || 1, 10);
  const book = queryStringParameters.book || 'journal'; // default fallback
  console.log('Querying comments for book:', book, 'page:', page);
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('book', book) // <-- filter by book
    .eq('page', page)
    .order('created_at', { ascending: true });
    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Failed to fetch comments' }),
      };
    }
    return {
      statusCode: 200,
      body: JSON.stringify({ comments: data }),
    };
  } else if (httpMethod === 'POST') {
  try {
const { user, text, page, book } = newComment;
const pageInt = parseInt(page, 10);
const { error } = await supabase
  .from('comments')
  .insert([{ user, text, page: pageInt, book }]); // <-- include book
    if (error) {
      console.error('Supabase insert error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Failed to add comment', error: error.message }),
      };
    }
    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'Comment added successfully' }),
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Invalid JSON in request body', error: error.message }),
    };
  }
    }
  }

  // /comments/reset endpoint
  if (path.endsWith('/comments/reset') && httpMethod === 'POST') {
    try {
      // ...existing code...
const { password, page, book } = data;
if (password !== 'Admin123') {
  // ...existing code...
}
let error;
if (page && book) {
  ({ error } = await supabase
    .from('comments')
    .delete()
    .eq('page', page)
    .eq('book', book)); // <-- filter by book
} else if (book) {
  ({ error } = await supabase
    .from('comments')
    .delete()
    .eq('book', book)); // <-- delete all for book
} else {
  ({ error } = await supabase
    .from('comments')
    .delete()
    .neq('id', 0));
}
// ...existing code...
      if (error) {
        return {
          statusCode: 500,
          body: JSON.stringify({ message: 'Failed to reset comments' }),
        };
      }
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Comments reset' }),
      };
    } catch (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid JSON in request body' }),
      };
    }
  }

  // Not found
  return {
    statusCode: 404,
    body: 'Not Found',
  };
};