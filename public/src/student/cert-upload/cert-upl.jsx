import React, { useState } from "react";
import "./cert-upl.css";
import spider from "../../utils/API";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Upload() {
  const [emailCount, setCount] = useState(0);
  const [emails, setEmails] = useState([]);

  const certificateRequest = (e) => {
    e.preventDefault();
    let fileUpload = document.getElementById("cert").files[0];
    let certType = document.getElementById("certType").value;
    if (emailCount && fileUpload && certType) {
      let r = window.confirm(`Confirm selection: ${emails}`);
      if (r === true) {
        let cd = new FormData();
        cd.set("type", parseInt(1));
        cd.append("certificate", fileUpload);
        let emails_array = [];
        if (emails.length === 1) {
          emails_array.push(emails[0] + ",");
        } else {
          emails.forEach(function (ele) {
            emails_array.push(ele);
          });
        }
        cd.set("path", emails_array);
        for (var value of cd.values()) {
          console.log(value);
        }
        spider
          .post("api/certificate_request", cd)
          .then((res) => {
            console.log("posted");
            console.log(res);
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        alert("poi muttiko");
      }
    }
  };
  return (
    <div className="container" id="cert-upl">
      <h2 className="text-center cert-upl-head">
        Request Certificate Verification
      </h2>
      <div className="row">
        <div className="col-md-6 form-left">
          <form>
            <div className="form-group">
              <label htmlFor="emailaddr">Email address</label>
              <input
                type="email"
                className="form-control"
                name="emailaddr"
                id="emailaddr"
                aria-describedby="emailHelp"
                required
              />
              <small id="emailHelp" className="form-text text-muted">
                Enter email addresses in the order of preference from highest.
              </small>
            </div>
            <div className="text-center">
              <button
                type="submit"
                className="btn btn-primary"
                onClick={(e) => {
                  e.preventDefault();
                  let emailValues = document.getElementById("emailaddr");
                  if (emailValues.value !== "") {
                    const re = /\S+@nitt\.edu/;
                    if (re.test(emailValues.value) === true) {
                      setCount(emailCount + 1);
                      setEmails(emails.concat(emailValues.value));
                      console.log(emailCount);
                      console.log(emails);
                    } else {
                      alert("Enter valid nitt email.");
                    }
                    emailValues.value = "";
                  }
                }}
              >
                Add
              </button>
            </div>
            <br />
            <div className="form-group">
              <label htmlFor="certType">Enter certificate type</label>
              <select name="certType" id="certType" className="form-control">
                <option value="bonafide">Bonafide</option>
                <option value="X">Certificate X</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="cert">Add certificate</label>
              <input type="file" className="form-control-file" id="cert" />
            </div>
            <br />

            <div className="form-group text-center">
              <button
                type="submit"
                className="btn btn-success"
                onClick={certificateRequest}
              >
                Submit
              </button>
              <ToastContainer
                position="top-center"
                autoClose={2000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
              />
            </div>
          </form>
        </div>
        <div className="col-md-6   d-flex justify-content-center">
          <ul className="list-group emailList">
            {emails.map((email, index) => {
              return (
                <li key={index} className="list-group-item">
                  <strong>{index + 1})</strong> {email}
                  <button
                    className="btn btn-del"
                    onClick={(e) => {
                      e.preventDefault();
                      setCount(emailCount - 1);
                      emails.splice(index - 1, 1);
                      setEmails(emails);
                    }}
                  >
                    <span>&#127335;</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Upload;
