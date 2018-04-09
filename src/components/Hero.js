import React from "react";

const Hero = props => {
  return (
    <li
      className={props.selectedHero === props.hero ? "selected" : ""}
      onClick={() => props.onSelect(props.hero)}
    >
      <button
        className="delete-button"
        onClick={event => props.onDelete(event, props.hero)}
      >
        Delete
      </button>
      <div>
        <div className="hero-element">
          <div className="badge">{props.hero.id}</div>
          <div className="name">{props.hero.name}</div>
          <div className="saying">{props.hero.saying}</div>
        </div>
      </div>
    </li>
  );
};

export default Hero;
