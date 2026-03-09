import styled from "styled-components";

interface ThemeToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const ThemeToggle = ({ checked, onChange }: ThemeToggleProps) => {
  return (
    <StyledWrapper>
      <div className="toggle-cont">
        <input
          className="toggle-input"
          id="theme-toggle"
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <label className="toggle-label" htmlFor="theme-toggle">
          <div className="cont-icon">
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
    width: fit-content;
    height: 24px;
    border-radius: 9999px;
  }

  .toggle-cont .toggle-input {
    display: none;
  }

  .toggle-cont .toggle-label {
    --gap: 2px;
    --width: 24px;
    cursor: pointer;
    position: relative;
    display: inline-block;
    padding: 2px;
    width: calc((var(--width) + var(--gap)) * 2);
    height: 100%;
    background-color: var(--dark);
    border: 1px solid #555;
    border-radius: 9999px;
    box-sizing: content-box;
    transition: all 0.3s ease-in-out;
  }

  .toggle-cont .toggle-label .cont-icon {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    width: var(--width);
    height: 24px;
    background-image: radial-gradient(circle at 50% 0%, #666 0%, var(--gray) 100%);
    border: 1px solid #888;
    border-radius: 9999px;
    transition: transform 0.3s ease-in-out;
  }

  .cont-icon .icon {
    width: 0.75rem;
    fill: var(--light);
  }

  .toggle-input:checked + .toggle-label {
    background-color: transparent;
    border-color: #3d6970;
  }

  .toggle-input:checked + .toggle-label .cont-icon {
    background-image: radial-gradient(circle at 50% 0%, #045ab1 0%, var(--primary) 100%);
    border-color: var(--primary);
    transform: translateX(calc((var(--gap) * 2) + 100%));
  }
`;

export default ThemeToggle;
