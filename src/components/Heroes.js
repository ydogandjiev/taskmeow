import React, { Component } from "react";
import Hero from "./Hero";
import EditHero from "./EditHero";
import heroesApi from "../api";

class Heroes extends Component {
  state = {
    heroes: [],
    addingHero: false
  };

  componentDidMount() {
    heroesApi.get().then(heroes => {
      this.setState({ heroes });
    });
  }

  handleSelect = hero => {
    this.setState({ selectedHero: hero });
  };

  handleDelete = (event, hero) => {
    event.preventDefault();
    event.stopPropagation();

    heroesApi.destroy(hero.id).then(() => {
      this.setState(prevState => ({
        heroes: prevState.heroes.filter(item => item !== hero)
      }));
    });
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
    if (this.state.addingHero) {
      heroesApi.create(this.state.selectedHero).then(hero => {
        this.setState(prevState => ({
          heroes: [...prevState.heroes, hero],
          addingHero: false,
          selectedHero: undefined
        }));
      });
    } else {
      heroesApi.update(this.state.selectedHero).then(() => {
        this.setState({ selectedHero: undefined });
      });
    }
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
