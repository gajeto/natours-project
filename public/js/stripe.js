import axios from 'axios';
import { showAlert } from './alerts';

export const bookTour = async (tourId) => {
  const stripe = Stripe(
    'pk_test_51J1c9cAXBuOiaGoX19lkYqfjU9U9wGhVEmHZ0FeMwyL6TjKsXhftW7JEVjxrpyPU85WOGZcUQWVZ1BGy1oS9wHvQ00OevbC95w'
  );

  try {
    // 1) Get checkout session from API
    const session = await axios(
      `http://localhost:3000/api/v1/bookings/checkout-session/${tourId}`
    );
    console.log(session);

    // 2) Create checkout form + chanre credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
    stripe.setMaxNetworkRetries(2);
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
