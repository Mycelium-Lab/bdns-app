import React, { useState } from 'react'
import styled from '@emotion/styled'
import mq from 'mediaQuery'

const SnackbarContainer = styled('div')`
  visibility: hidden;
  min-width: 250px;
  margin-left: -40px;
  background-color: rgba(82, 82, 82, 0.95);
  color: #fff;
  text-align: center;
  border-radius: 6px;
  padding: 0.8em;
  position: fixed;
  z-index: 1;
  left: 50%;
  transform: translate(-35%, 0);
  top: 10px;
  font-size: 0.9rem;
  ${mq.small`
    margin-left: -90px;
  `}
`
const Show = styled(SnackbarContainer)`
  visibility: visible; /* Show the snackbar */
  /* Add animation: Take 0.5 seconds to fade in and out the snackbar. 
However, delay the fade out process for 4.5 seconds */

  -webkit-animation: fadein 0.5s, fadeout 0.5s 4.5s;
  animation: fadein 0.5s, fadeout 0.5s 4.5s;

  * Animations to fade the snackbar in and out */ @-webkit-keyframes fadein {
    from {
      top: 0;
      opacity: 0;
    }
    to {
      top: 10px;
      opacity: 1;
    }
  }

  @keyframes fadein {
    from {
      top: 0;
      opacity: 0;
    }
    to {
      top: 10px;
      opacity: 1;
    }
  }

  @-webkit-keyframes fadeout {
    from {
      top: 10px;
      opacity: 1;
    }
    to {
      top: 0;
      opacity: 0;
    }
  }

  @keyframes fadeout {
    from {
      top: 10px;
      opacity: 1;
    }
    to {
      top: 0;
      opacity: 0;
    }
  }
`

export default function Snackbar({ children }) {
  const [isActive, setActive] = useState(false)

  const openSnackBar = () => {
    setActive(true)
    setTimeout(() => {
      setActive(false)
    }, 5000)
  }

  return (
    <>
      <span onClick={openSnackBar}>Mint</span>
      {isActive ? <Show>{children}</Show> : <SnackbarContainer />}
    </>
  )
}
