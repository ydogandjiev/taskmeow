import React, { Component } from "react";
import Hero from "./Hero";
import EditHero from "./EditHero";

class Heroes extends Component {
  state = {
    heroes: [],
    addingHero: false
  };

  componentDidMount() {
    fetch("/api/heroes")
      .then(result => result.json())
      .then(json => {
        this.setState({
          heroes: json
        });
      });
  }

  handleSelect = hero => {
    this.setState({ selectedHero: hero });
  };

  handleDelete = (event, hero) => {
    event.preventDefault();
    event.stopPropagation();

    this.setState(prevState => ({
      heroes: prevState.heroes.filter(item => item !== hero)
    }));
  };

  handleChange = event => {
    const target = event.target;
    this.setState(prevState => {
      const selectedHero = prevState.selectedHero;
      selectedHero[target.name] = target.value;
      return {
        selectedHero: selectedHero
      };
    });
  };

  handleCancel = () => {
    this.setState({
      addingHero: false,
      selectedHero: undefined
    });
  };

  handleSave = () => {
    this.setState(prevState => ({
      heroes: [...prevState.heroes, prevState.selectedHero],
      addingHero: false,
      selectedHero: undefined
    }));
  };

  handleAdd = () => {
    this.setState({
      addingHero: true,
      selectedHero: { id: "", name: "", saying: "" }
    });
  };

  render() {
    return (
      <div>
        <ul className="heroes">
          {this.state.heroes.map(hero => (
            <Hero
              hero={hero}
              selectedHero={this.state.selectedHero}
              onSelect={this.handleSelect}
              onDelete={this.handleDelete}
            />
          ))}
        </ul>
        <button onClick={this.handleAdd}>Add New Hero</button>
        <div className="editarea">
          <EditHero
            addingHero={this.state.addingHero}
            selectedHero={this.state.selectedHero}
            onChange={this.handleChange}
            onCancel={this.handleCancel}
            onSave={this.handleSave}
          />
        </div>
      </div>
    );
  }
}

export default Heroes;
