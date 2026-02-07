import { useTranslation } from 'react-i18next';

const Investments = ({ theme }) => {
  const { t } = useTranslation();

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 pb-32">
      <div className={`text-center ${theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'}`}>
        <h1 className="text-4xl font-bold mb-4">{t('investment')}</h1>
        <p className={`text-lg ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>
          {t('investmentsPage')}
        </p>
      </div>
    </div>
  );
};

export default Investments;
