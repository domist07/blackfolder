import { useCallback } from 'react';

/**
 * TextInputPanel - Eingabe-Formular für die Namensschild-Daten
 * 
 * @param {Object} props
 * @param {Object} props.data - Aktuelle Formulardaten
 * @param {Function} props.onChange - Callback bei Änderungen
 */
function TextInputPanel({ data, onChange }) {
  /**
   * Generischer Input-Handler
   * @param {string} field - Feldname im State
   */
  const handleChange = useCallback((field) => (e) => {
    onChange({ ...data, [field]: e.target.value });
  }, [data, onChange]);

  /**
   * Bestimmt ob ein Feld Inhalt hat (für CSS-Klasse)
   * @param {string} value - Feldwert
   * @returns {string} CSS-Klasse
   */
  const getInputClass = (value) => {
    return value && value.trim().length > 0 ? 'has-content' : '';
  };

  return (
    <div className="content-box">
      <h1 style={{ 
        fontFamily: "'Roboto', sans-serif",
        color: '#9d0000',
        fontSize: '2rem',
        marginBottom: '0.5rem'
      }}>
        LJC-Namensschild
      </h1>

      <p style={{ color: '#666', marginBottom: '1.5rem' }}>
        Erstelle dein persönliches LJC-Namensschild für die Notenmappe.
      </p>

      <form onSubmit={(e) => e.preventDefault()}>
        {/* Vor- und Nachname nebeneinander */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="firstName">Vorname</label>
            <input
              type="text"
              id="firstName"
              value={data.firstName}
              onChange={handleChange('firstName')}
              placeholder="Max"
              maxLength={50}
              className={getInputClass(data.firstName)}
              autoComplete="given-name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="lastName">Nachname</label>
            <input
              type="text"
              id="lastName"
              value={data.lastName}
              onChange={handleChange('lastName')}
              placeholder="Mustermann"
              maxLength={50}
              className={getInputClass(data.lastName)}
              autoComplete="family-name"
            />
          </div>
        </div>

        {/* Telefonnummer */}
        <div className="form-group">
          <label htmlFor="phoneNumber">Rufnummer</label>
          <input
            type="tel"
            id="phoneNumber"
            value={data.phoneNumber}
            onChange={handleChange('phoneNumber')}
            placeholder="z.B. +49 123 456789"
            maxLength={30}
            className={getInputClass(data.phoneNumber)}
            autoComplete="tel"
          />
        </div>

        {/* E-Mail */}
        <div className="form-group">
          <label htmlFor="email">E-Mail</label>
          <input
            type="text"
            id="email"
            value={data.email}
            onChange={handleChange('email')}
            placeholder="max.mustermann@example.com"
            maxLength={100}
            className={getInputClass(data.email)}
            autoComplete="email"
          />
          <span className="input-hint">
            Tipp: Verwende <strong>/</strong> für einen manuellen Zeilenumbruch
          </span>
        </div>
      </form>
    </div>
  );
}

export default TextInputPanel;