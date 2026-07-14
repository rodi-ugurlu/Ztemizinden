import { Link } from 'react-router-dom';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import resetImage from './animated/assets/login.svg';
import './ResetPasswordPage.css';

export default function ResetPasswordPage() {
  return (
    <main className="password-reset">
      <section className="password-reset__visual" aria-hidden="true">
        <div className="password-reset__brand">Maintly</div>
        <img src={resetImage} alt="" />
      </section>

      <section className="password-reset__panel">
        <div className="password-reset__card">
          <div className="password-reset__icon">
            <LockKeyhole size={24} />
          </div>
          <h1>Şifre Yönetimi</h1>
          <p>
            Şifre yenileme bağlantıları güvenli giriş sistemimiz tarafından işlenir.
            E-postandaki bağlantıyı aç veya giriş ekranından yeni bir bağlantı iste.
          </p>

          <div className="password-reset__success">
            <div className="password-reset__actions">
              <Link to="/customer/login">
                <span>Fabrika/İşletme Girişi</span>
                <ArrowRight size={16} />
              </Link>
              <Link to="/service/login">
                <span>Servis Girişi</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
