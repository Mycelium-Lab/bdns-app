import { injectGlobal } from 'emotion'

injectGlobal`
  * {
    box-sizing: border-box;
  }
  body {
    font-family: Overpass;
    background: #F0F6FA;
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
