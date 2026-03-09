import styled from "styled-components";

interface ThemeToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const ThemeToggle = ({ checked, onChange }: ThemeToggleProps) => {
  return (
    <StyledWrapper>
      <div className="toggle-cont" style={{ containerType: "normal" }}>
        <input
          className="toggle-input"
          id="theme-toggle"
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <label className="toggle-label" htmlFor="theme-toggle">
          <div className="cont-icon">
            {Array.from({ length: 24 }).map((_, i) => (
              <span
                key={i}
                className="sparkle"
                style={{
                  "--deg": `${i * 15}`,
                  "--duration": `${20 + i * 2}`,
                  "--width": `${10 + (i % 5) * 3}`,
                } as React.CSSProperties}
              />
            ))}
            <svg
              className="icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              {checked ? (
                <path d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
              ) : (
                <path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM18.894 6.166a.75.75 0 0 0-1.06-1.06l-1.591 1.59a.75.75 0 1 0 1.06 1.061l1.591-1.59ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM17.834 18.894a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 1 0-1.061 1.06l1.59 1.591ZM12 18a.75.75 0 0 1 .75.75V21a.75.75 0 0 1-1.5 0v-2.25A.75.75 0 0 1 12 18ZM7.758 17.303a.75.75 0 0 0-1.061-1.06l-1.591 1.59a.75.75 0 0 0 1.06 1.061l1.591-1.59ZM6 12a.75.75 0 0 1-.75.75H3a.75.75 0 0 1 0-1.5h2.25A.75.75 0 0 1 6 12ZM6.697 7.757a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 0 0-1.061 1.06l1.59 1.591Z" />
              )}
            </svg>
          </div>
        </label>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .toggle-cont {
    --primary: #54a8fc;
    --light: #d9d9d9;
    --dark: #121212;
    --gray: #414344;

    position: relative;
    z-index: 10;

    width: fit-content;
    height: 32px;

    border-radius: 9999px;
  }

  .toggle-cont .toggle-input {
    display: none;
  }

  .toggle-cont .toggle-label {
    --gap: 3px;
    --width: 32px;

    cursor: pointer;

    position: relative;
    display: inline-block;

    padding: 0.3rem;
    width: calc((var(--width) + var(--gap)) * 2);
    height: 100%;
    background-color: var(--dark);

    border: 1px solid #777777;
    border-bottom: 0;

    border-radius: 9999px;
    box-sizing: content-box;
    transition: all 0.3s ease-in-out;
  }

  .toggle-label::before {
    content: "";

    position: absolute;
    z-index: -10;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);

    width: calc(100% + 1rem);
    height: calc(100% + 1rem);
    background-color: var(--gray);

    border: 1px solid #777777;
    border-bottom: 0;
    border-radius: 9999px;

    transition: all 0.3s ease-in-out;
  }

  .toggle-label::after {
    content: "";

    position: absolute;
    z-index: -10;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);

    width: 100%;
    height: 100%;
    background-image: radial-gradient(
      circle at 50% -100%,
      rgb(58, 155, 252) 0%,
      rgba(12, 12, 12, 1) 80%
    );

    border-radius: 9999px;
  }

  .toggle-cont .toggle-label .cont-icon {
    display: flex;
    justify-content: center;
    align-items: center;

    position: relative;
    width: var(--width);
    height: 32px;
    background-image: radial-gradient(
      circle at 50% 0%,
      #666666 0%,
      var(--gray) 100%
    );

    border: 1px solid #aaaaaa;
    border-bottom: 0;
    border-radius: 9999px;
    box-shadow: inset 0 -0.1rem 0.1rem var(--primary),
      inset 0 0 0.3rem 0.5rem var(--second);

    transition: transform 0.3s ease-in-out;
    overflow: clip;
  }

  .cont-icon .sparkle {
    position: absolute;
    top: 50%;
    left: 50%;

    display: block;

    width: calc(var(--width) * 1px);
    aspect-ratio: 1;
    background-color: var(--light);

    border-radius: 50%;
    transform-origin: 50% 50%;
    rotate: calc(1deg * var(--deg));
    transform: translate(-50%, -50%);
    animation: sparkle calc(100s / var(--duration)) linear
      calc(0s / var(--duration)) infinite;
  }

  @keyframes sparkle {
    to {
      width: calc(var(--width) * 0.5px);
      transform: translate(2000%, -50%);
    }
  }

  .cont-icon .icon {
    width: 0.9rem;
    fill: var(--light);
  }

  /* Checked state */
  .toggle-input:checked + .toggle-label {
    background-color: #41434400;
    border: 1px solid #3d6970;
    border-bottom: 0;
  }

  .toggle-input:checked + .toggle-label::before {
    box-shadow: 0 0.7rem 1.5rem -1.2rem #0080ff;
  }

  .toggle-input:checked + .toggle-label .cont-icon {
    overflow: visible;

    background-image: radial-gradient(
      circle at 50% 0%,
      #045ab1 0%,
      var(--primary) 100%
    );

    border: 1px solid var(--primary);
    border-bottom: 0;

    transform: translateX(calc((var(--gap) * 2) + 100%)) rotate(-225deg);
  }

  .toggle-input:checked + .toggle-label .cont-icon .sparkle {
    z-index: -10;
    width: calc(var(--width) * 1.5px);
    background-color: #acacac;
  }
`;

export default ThemeToggle;
