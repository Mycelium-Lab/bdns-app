import SingleName from './SingleName'

function ListName({ match, location }) {
  return (
    <>
      {location.state.offers.map(name => (
        <SingleName match={match} location={location} offer={name} key={name} />
      ))}
      {location.state.searchTerm && (
        <SingleName
          match={match}
          location={location}
          offer={location.state.searchTerm}
          key={match.params.name}
        />
      )}
    </>
  )
}

export default ListName
