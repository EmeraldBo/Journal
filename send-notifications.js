const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  const { title, message } = JSON.parse(event.body);

  const response = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Authorization': '19ba157f-7fa3-4b2f-a73f-29b593ca82c1',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      app_id: 'YOUR-ONESIGNAL-APP-ID',
      included_segments: ['All'],
      headings: { en: title },
      contents: { en: message }
    })
  });

  const data = await response.json();
  return {
    statusCode: 200,
    body: JSON.stringify(data)
  };
};