const pc = require("picocolors");

const requestLogger = (req, res, next) => {
  const { method, originalUrl } = req; 
  const startTime = Date.now(); 


  const methodColors = {
    GET: pc.green,
    POST: pc.yellow,
    PUT: pc.blue,
    DELETE: pc.red,
    PATCH: pc.magenta,
  };


  const colorFn = methodColors[method] || pc.white;
  const coloredMethod = pc.bold(colorFn(method));



  res.on("finish", () => {
    const timeString = new Date().toLocaleTimeString(); 
    const duration = Date.now() - startTime; 
    const statusCode = res.statusCode;

    let statusColor = pc.green;
    if (statusCode >= 400) statusColor = pc.red;       
    else if (statusCode >= 300) statusColor = pc.yellow; 


    const logLine = `${pc.gray(`[${timeString}]`)} | ${coloredMethod} -> ${pc.cyan(originalUrl)} | Status: ${statusColor(statusCode)} (${duration}ms)`;

  
    if (statusCode >= 400) {
      console.log(`${pc.red("⚠️ ")} ${logLine}`);
    } else {
      console.log(`${pc.cyan("ℹ️ ")} ${logLine}`);
    }
  });

  next(); 
};

module.exports = { requestLogger };