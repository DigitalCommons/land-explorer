# How to add a new user analytic

## Design

Add the analytic to our [tracking plan](https://docs.google.com/spreadsheets/d/1cujoZ9dSI9oOzGwFQIo31Z0bzbT2pKNaztVRRziZ338/edit?gid=1641519238#gid=1641519238). Think about why we need the analytic. These are the 3 kind of things that we're trying to track:
* Building a picture of who is using LX, how did they get here, what for
* Building a picture of usage and usability once people are in
* Building a picture of how much people like/value it, share/come back

Think about which properties would be useful to include in the events, how the server-side can know this info, and therefore where in the app it will need to be sent. We currently send all analytics on the server-side, and aim to do this for all future analytics where possible since they are more reliable than client-side analytics.

We need to ensure anonymity in the backend analytics if the user hasn't consented. See https://github.com/DigitalCommons/land-explorer/issues/29 for more discussion.

## Implementation

You can find the base analytics implementation in `instrument.ts` on the back-end. We have created some convenience functions in the app that can be used to send analytics. They extend the base implementation in order to include data that is commonly sent with events.

You should choose a suitable convenience function in this order:

1. If an event is associated with a logged-in user and map, use the `trackUserMapEvent()` function
  - This function sends anonymised user and map identifiers along with the specific data for the event you're tracking
2. Otherwise, if an event is associated with a logged-in user but not a map, use the `trackUserEvent()` function
3. Otherwise, use the `trackRawEvent()` function.

For all the above functions, you supply
* an event name, which should be added to the `Event` object in `instrument.ts` in the format `<Category>_<Action>`
* (optionally) any other relevant data to the event in a JS object

## Testing

You can test your implementation on your dev server by looking at the console logs on the back-end. Where an event is tracked, a log will be sent, showing the event name and all the data included.

Finally, once the analytic is deployed to staging for QA, you can login to the Mixpanel console (main account is admin@, you can log in via bitward and create yourself a personal account with your email address) and test that the events are appearing in the console.
