import { redirect } from 'next/navigation';
import { api } from '../../lib/api';

async function registerCustomer(formData: FormData) {
  'use server';

  const customer = await api.registerCustomer({
    fullName: String(formData.get('fullName') ?? ''),
    email: String(formData.get('email') ?? '') || undefined,
    phone: String(formData.get('phone') ?? '') || undefined
  });

  redirect(`/motorcycles?customerId=${customer.id}`);
}

export default function RegisterPage() {
  return (
    <main className="page form-page">
      <section className="form-shell">
        <p className="eyebrow">Step 1</p>
        <h1>Register customer</h1>
        <p className="lede">Create a customer profile before adding motorcycle details.</p>

        <form action={registerCustomer} className="flow-form">
          <label>
            Full name
            <input name="fullName" placeholder="Hruday Vishal Banda" required minLength={2} maxLength={120} />
          </label>

          <label>
            Email
            <input name="email" type="email" placeholder="hruday@example.com" />
          </label>

          <label>
            Phone
            <input name="phone" type="tel" placeholder="+919876543210" />
          </label>

          <button type="submit">Continue</button>
        </form>
      </section>
    </main>
  );
}

