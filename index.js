const request = require("request");
const fs = require("fs");

const vatSpyURL =
  "https://raw.githubusercontent.com/vatsimnetwork/vatspy-data-project/master/VATSpy.dat";
const firURL =
  "https://raw.githubusercontent.com/vatsimnetwork/vatspy-data-project/master/FIRBoundaries.dat";

const vatSpyData = {
  countries: [],
  airports: [],
  positions: [],
  firs: [],
  uirs: [],
};

request.get(vatSpyURL, function (err, res, body) {
  if (!err && res.statusCode == 200) {
    body = body.split(/\r?\n/);

    //remove empty lines
    body = body.filter(Boolean);

    body = body.filter((val) => {
      return val.charAt(0) != ";";
    });

    const indexes = body.reduce(
      (c, v, i) => (/\[([A-Za-z])*\]/g.test(v) ? c.concat(i) : c),
      []
    );

    //Countries Array
    for (let i = 1; i < indexes[1] - 1; i++) {
      const element = body[i].split("|");
      if (i == 1) {
        vatSpyData.countries.push({
          name: element[0],
          abbreviations: [element[1]],
          type: element[2],
        });
      } else {
        if (
          vatSpyData.countries[vatSpyData.countries.length - 1].name ==
          element[0]
        ) {
          vatSpyData.countries[
            vatSpyData.countries.length - 1
          ].abbreviations.push(element[1]);
        } else {
          vatSpyData.countries.push({
            name: element[0],
            abbreviations: [element[1]],
            type: element[2],
          });
        }
      }
    }

    // Airports Array
    for (let i = indexes[1] + 1; i < indexes[2]; i++) {
      const element = body[i].split("|");
      vatSpyData.airports.push({
        icao: element[0],
        name: element[1],
        fir: element[5],
      });
    }

    // FIR Array
    for (let i = indexes[2] + 1; i < indexes[3]; i++) {
      const element = body[i].split("|");
      vatSpyData.positions.push({
        position: element[2] ? element[2] : element[0],
        name: element[1],
        fir: element[0],
      });
      if (i == indexes[2] + 1) {
        vatSpyData.firs.push({
          name: element[0],
          coordinates: [],
        });
      } else {
        if (vatSpyData.firs[vatSpyData.firs.length - 1].name != element[0]) {
          vatSpyData.firs.push({
            name: element[0],
            coordinates: [],
            parent: element[0] != element[3] ? element[3] : "",
          });
        }
      }
    }

    // UIR Array
    for (let i = indexes[3] + 1; i < indexes[4]; i++) {
      const element = body[i].split("|");
      vatSpyData.uirs.push({
        ident: element[0],
        name: element[1],
        fir: element[2].split(","),
      });
    }

    request.get(firURL, function (err, res, body) {
      if (!err && res.statusCode == 200) {
        body = body.split(/\r?\n/);

        //Remove empty lines
        body = body.filter(Boolean);

        for (let i = 0; i < body.length; i++) {
          const element = body[i].split("|");
          if (/[a-zA-Z]/.test(element[0])) {
            for (
              let j = parseInt([i]) + 1;
              j < parseInt(element[3]) + parseInt([i]) + 1;
              j++
            ) {
              const el = body[j].split("|");
              const k = vatSpyData.firs.findIndex(el => el.name == element[0]);
              if (vatSpyData.firs[k]) {
                vatSpyData.firs[k].coordinates.push({
                  latitude: el[0],
                  longitude: el[1],
                });
              }
            }
          }
        }
        const data = JSON.stringify(vatSpyData);
        fs.writeFileSync("data.json", data);
      }
    });
  }
});
