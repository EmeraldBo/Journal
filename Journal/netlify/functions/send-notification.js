
exports.handler = async function(event, context) {
  const { title, message } = JSON.parse(event.body);

  const response = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic os_v2_app_dg5bk737unfs7jz7fg2zhsucyfove3mq7iru7uetrqmi2ohs4gdlzvxopmntoa7h4cuufyzbny6qtfjuus4s4oojnnw5vi3liojk63q',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      app_id: '19ba157f-7fa3-4b2f-a73f-29b593ca82c1',
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