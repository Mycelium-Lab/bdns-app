import { injectGlobal } from 'emotion'

injectGlobal`
  * {
    box-sizing: border-box;
  }
  body {
    font-family: Overpass;
    background: rgba(34, 34, 36, 0.95);
    margin: 0;
  }

  a {
    color: #000;
    text-decoration: none;
    transition: 0.2s;

    &:hover {
      color: #111;
    }

    &:visited {
      color: #000
    } 
  }
`
