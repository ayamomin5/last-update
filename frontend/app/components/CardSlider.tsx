"use client";

import React from 'react';
import styled from 'styled-components';
import Image from 'next/image';
import { useTheme } from 'next-themes';

const CardSlider = () => {
  const { theme } = useTheme();
  const [textColor, setTextColor] = React.useState('rgba(0, 0, 0, 0.6)');

  React.useEffect(() => {
    setTextColor(theme === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.6)');
  }, [theme]);

  const companyLogos = [
    { src: '/companies/Asia 004.png', alt: 'Asia' },
    { src: '/companies/FIB 002.png', alt: 'FIB' },
    { src: '/companies/Korek 001.png', alt: 'korek' },
    { src: '/companies/Newroz 003.png', alt: 'Newroz' },
    { src: '/companies/Rwanga 005.png', alt: 'Rwanga' },
    { src: '/companies/fAST 001.png', alt: 'Fatlink' },
    { src: '/companies/awrosoft 002.png', alt: 'Awrosoft' },
    { src: '/companies/kar.png', alt: 'Kar Group' },
    { src: '/companies/vana.png', alt: 'Vana' },
    { src: '/companies/cmc.png', alt: 'CMC' },
  ];

  return (
    <StyledWrapper>
      <div className="slider" style={{ '--width': '120px', '--height': '120px', '--quantity': companyLogos.length } as React.CSSProperties}>
        <div className="list">
          {[...companyLogos, ...companyLogos].map((logo, index) => (
            <div className="item" key={index} style={{ '--position': index + 1 } as React.CSSProperties}>
              <div className="card">
                <Image src={logo.src} alt={logo.alt} width={120} height={120} style={{ objectFit: 'cover' }} />
              </div>
              <p className="company-name" style={{ color: textColor }}>{logo.alt}</p>
            </div>
          ))}
        </div>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .card {
    width: var(--width);
    height: var(--height);
    border-radius: 50%; /* Makes the card circular */
    overflow: hidden; /* Ensures the image fits within the circle */
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #ccc;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }

  
  .slider {
    width: 100%;
    height: calc(var(--height) + 40px); /* accommodate company name below logos */
    overflow-x: hidden;
    overflow-y: visible;
    mask-image: linear-gradient(to right, transparent, #000 10% 90%, transparent);
  }

  .slider .list {
    display: flex;
    width: calc((var(--width) + 20px) * var(--quantity)); /* include item margin horizontally */
    position: relative;
    animation: autoRun 15s linear infinite;
  }
  .slider .list .item {
    width: var(--width);
    /* keep card height but allocate extra space in slider wrapper */
    position: relative;
    margin-right: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .company-name {
    margin-top: 8px;
    text-align: center;
    font-size: 14px;
    font-weight: 500;
  }
  @keyframes autoRun {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(calc(-1 * (var(--width) + 20px) * var(--quantity)));
    }
  }
  
`;

export default CardSlider; 