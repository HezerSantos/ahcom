import React, { ReactNode } from 'react';

// Define a type for props that include children
interface Props {
  children?: ReactNode;
}

export const PageSection: React.FC<Props> = ({ children }) => {
  return (
    <section className="page-section">
        {children}
    </section>
  );
};

export const PageSectionChild: React.FC<Props> = ({ children }) => {
  return (
    <>
      <div className='page-section__child'>
        {children}
      </div>
    </>
  );
};